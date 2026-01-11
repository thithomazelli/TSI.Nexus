using AutoMapper;
using TSI.Friday.Contracts.Enums;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Contracts.Models.DTOs;
using TSI.Friday.Contracts.Utilities;

namespace TSI.Friday.Services
{
    public sealed class CompanyService : ICompanyService
    {
        #region Properties

        /// <summary>
        /// Repository object created to access the Company registers on database using EntityFramework.
        /// </summary>
        private readonly IRepository<Company> _repository;
        private readonly IMapper _mapper;

        #endregion Properties

        #region Public methods

        /// <summary>
        /// CompanyService constructor created to initialize the "_repository" using Dependency Injection.
        /// </summary>
        /// <param name="repository">IRepository<Company> object used to initialize the internal variable using Dependency Injection.</param>
        public CompanyService(IRepository<Company> repository, IMapper mapper)
        {
            _repository = repository;
            _mapper = mapper;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<ClientDto>> Add(ClientDto clientDto)
        {
            WebApiResponse<ClientDto> result = new();

            try
            {
                var companyEntity = _mapper.Map<Company>(clientDto);
                var companyDuplicatedMessage = await CheckIfCompanyIsDuplicatedAndGetErrorMessage(companyEntity);

                if (!string.IsNullOrEmpty(companyDuplicatedMessage))
                {
                    result.Status = ResponseStatus.Error;
                    result.Message = companyDuplicatedMessage;
                    return result;
                }

                await _repository.AddAsync(companyEntity);

                result.Data = clientDto;
                result.Status = ResponseStatus.Success;
                result.Message = $"Cliente {clientDto.Name} cadastrado com sucesso.";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message = $"Não foi possível cadastrar o Cliente {clientDto.Name} na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<ClientDto>> Update(ClientDto clientDto)
        {
            WebApiResponse<ClientDto> result = new();

            try
            {
                var companyEntity = _mapper.Map<Company>(clientDto);
                var companyDuplicatedMessage = await CheckIfCompanyIsDuplicatedAndGetErrorMessage(companyEntity);

                if (!string.IsNullOrEmpty(companyDuplicatedMessage))
                {
                    result.Status = ResponseStatus.Error;
                    result.Message = companyDuplicatedMessage;
                    return result;
                }

                await _repository.UpdateAsync(companyEntity);

                result.Data = clientDto;
                result.Status = ResponseStatus.Success;
                result.Message = $"Cliente {clientDto.Name} atualizado com sucesso.";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message = $"Não foi possível atualizar os dados do Cliente {clientDto.Name} na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<ClientDto>> Remove(ClientDto clientDto)
        {
            WebApiResponse<ClientDto> result = new();

            try
            {
                var companyEntity = await _repository.GetByIdAsync(clientDto.Id);
                if (companyEntity == null)
                {
                    throw new Exception($"Cliente com Id {clientDto.Id} não encontrado.");
                }

                await _repository.RemoveAsync(companyEntity);

                result.Data = clientDto;
                result.Status = ResponseStatus.Success;
                result.Message = $"Cliente {companyEntity.Name} removido com sucesso.";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message = $"Não foi possível remover o Cliente {clientDto.Name} da base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<IEnumerable<ClientDto>>> FindAll()
        {
            WebApiResponse<IEnumerable<ClientDto>> result = new();

            try
            {
                var clientEntityList = await _repository.GetAllAsync();
                result.Data = _mapper.Map<IEnumerable<ClientDto>>(clientEntityList);
                result.Status = ResponseStatus.Success;
                result.Message = $"{result.Data?.Count() ?? 0} registro(s) encontrado(s).";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message = $"Não foi possível acessar os registros de Clientes na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<ClientDto>> FindById(int? id)
        {
            WebApiResponse<ClientDto> result = new();

            try
            {
                var clientEntity = await _repository.GetByIdAsync(id);
                result.Data = _mapper.Map<ClientDto>(clientEntity);
                result.Status = ResponseStatus.Success;
                result.Message = result.Data != null
                    ? $"Cliente {result.Data.Name} encontrado com sucesso"
                    : $"Nenhum Cliente com o ID {id} foi encontrado";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message = $"Não foi possível acessar os registros de Clientes na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<ClientDto>> FindByNationalRegistry(string nationalRegistry)
        {
            WebApiResponse<ClientDto> result = new();

            try
            {
                var clientEntity = await _repository.FirstOrDefaultAsync(x => x.NationalRegistry == nationalRegistry);
                result.Data = _mapper.Map<ClientDto>(clientEntity);
                result.Status = ResponseStatus.Success;
                result.Message = result.Data != null
                    ? $"Cliente {result.Data.Name} encontrado com sucesso."
                    : $"Nenhum Cliente com o CNPJ {nationalRegistry} foi encontrado";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message = $"Não foi possível acessar os registros de Clientes na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<ClientDto>> FindByEmail(string email)
        {
            WebApiResponse<ClientDto> result = new();

            try
            {
                var clientEntity = await _repository.FirstOrDefaultAsync(x => x.Email == email);
                result.Data = _mapper.Map<ClientDto>(clientEntity);
                result.Status = ResponseStatus.Success;
                result.Message = result.Data != null
                    ? $"Cliente {result.Data.Name} encontrado com sucesso."
                    : $"Nenhum Cliente com o E-mail {email} foi encontrado";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message = $"Não foi possível acessar os registros de Clientes na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        #endregion Public methods

        #region Private methods

        /// <summary>
        /// Should verify if the Company is already being registered on the database.
        /// </summary>
        /// <param name="company">The Company object that is being added or updated.</param>
        /// <returns>The error message when Company is duplicated. Otherwise an empty string.</returns>
        private async Task<string> CheckIfCompanyIsDuplicatedAndGetErrorMessage(Company company)
        {
            if (await IsNameDuplicated(company))
            {
                return $"Já existe um Cliente cadastrado com Nome {company.Name}.";
            }

            if (await IsEmailDuplicated(company))
            {
                return $"Já existe um Cliente cadastrado com E-mail {company.Email}.";
            }

            if (await IsNationalRegistryDuplicated(company))
            {
                return $"Já existe um Cliente cadastrado com o CNPJ {company.NationalRegistry}.";
            }

            return string.Empty;
        }

        /// <summary>
        /// Should verify if the Company email is already being used by another register on the database.
        /// </summary>
        /// <param name="company">The Company object that is being added or updated.</param>
        /// <returns>True when the Email is duplicated; Otherwise false.</returns>
        private async Task<bool> IsEmailDuplicated(Company company)
        {
            return await _repository
                .AnyAsync(_ => _.Id != company.Id && !string.IsNullOrEmpty(_.Email) && _.Email == company.Email);
        }

        /// <summary>
        /// Should verify if the Company name is already being used by another register on the database.
        /// </summary>
        /// <param name="company">The Company object that is being added or updated.</param>
        /// <returns>True when the Name is duplicated; Otherwise false.</returns>
        private async Task<bool> IsNameDuplicated(Company company)
        {
            return await _repository
                .AnyAsync(_ => _.Id != company.Id && _.Name == company.Name);
        }

        /// <summary>
        /// Should verify if the Company NationalRegistry is already being used by another register on the database.
        /// </summary>
        /// <param name="Company">The Company object that is being added or updated.</param>
        /// <returns>True when the NationalIDCard is duplicated; Otherwise false.</returns>
        private async Task<bool> IsNationalRegistryDuplicated(Company company)
        {
            return await _repository
                .AnyAsync(_ => _.Id != company.Id && !string.IsNullOrEmpty(_.NationalRegistry) &&
                            _.NationalRegistry == company.NationalRegistry);
        }

        #endregion Private methods
    }
}
