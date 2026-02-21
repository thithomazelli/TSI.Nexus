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
                var companyDuplicatedMessage = await CheckIfCompanyIsDuplicatedAndGetErrorMessage(
                    clientDto
                );

                if (!string.IsNullOrEmpty(companyDuplicatedMessage))
                {
                    result.Status = ResponseStatus.Error;
                    result.Message = companyDuplicatedMessage;
                    return result;
                }

                var companyEntity = _mapper.Map<Company>(clientDto);
                await _repository.AddAsync(companyEntity);

                result.Data = clientDto;
                result.Status = ResponseStatus.Success;
                result.Message = $"Cliente {clientDto.Name} cadastrado com sucesso.";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível cadastrar o Cliente {clientDto.Name} na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<ClientDto>> Update(ClientDto clientDto)
        {
            WebApiResponse<ClientDto> result = new();

            try
            {
                var companyDuplicatedMessage = await CheckIfCompanyIsDuplicatedAndGetErrorMessage(
                    clientDto
                );

                if (!string.IsNullOrEmpty(companyDuplicatedMessage))
                {
                    result.Status = ResponseStatus.Error;
                    result.Message = companyDuplicatedMessage;
                    return result;
                }

                // Load tracked entity including Addresses so EF can detect changes on navigation
                var existing = await _repository.GetByIdAsync(clientDto.Id, c => c.Addresses);

                if (existing == null)
                {
                    result.Status = ResponseStatus.Error;
                    result.Message = $"Cliente com Id {clientDto.Id} não encontrado.";
                    return result;
                }

                // Map simple/scalar properties from DTO to tracked entity
                _mapper.Map(clientDto, existing);

                await _repository.UpdateAsync(existing);

                result.Data = clientDto;
                result.Status = ResponseStatus.Success;
                result.Message = $"Cliente {clientDto.Name} atualizado com sucesso.";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível atualizar os dados do Cliente {clientDto.Name} na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<ClientDto>> FindByNationalRegistry(string nationalRegistry)
        {
            WebApiResponse<ClientDto> result = new();

            try
            {
                var clientEntity = await _repository.FirstOrDefaultAsync(x =>
                    x.NationalRegistry == nationalRegistry
                );
                result.Data = _mapper.Map<ClientDto>(clientEntity);
                result.Status = ResponseStatus.Success;
                result.Message =
                    result.Data != null
                        ? $"Cliente {result.Data.Name} encontrado com sucesso."
                        : $"Nenhum Cliente com o CNPJ {nationalRegistry} foi encontrado";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível acessar os registros de Clientes na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        #endregion Public methods

        #region Private methods

        /// <summary>
        /// Should verify if the Company is already being registered on the database.
        /// </summary>
        /// <param name="companyDto">The CompanyDTO object that is being added or updated.</param>
        /// <returns>The error message when Company is duplicated. Otherwise an empty string.</returns>
        private async Task<string> CheckIfCompanyIsDuplicatedAndGetErrorMessage(
            ClientDto companyDto
        )
        {
            if (await IsNameDuplicated(companyDto))
            {
                return $"Já existe um Cliente cadastrado com Nome {companyDto.Name}.";
            }

            if (await IsEmailDuplicated(companyDto))
            {
                return $"Já existe um Cliente cadastrado com E-mail {companyDto.Email}.";
            }

            if (await IsNationalRegistryDuplicated(companyDto))
            {
                return $"Já existe um Cliente cadastrado com o CNPJ {companyDto.NationalRegistry}.";
            }

            return string.Empty;
        }

        /// <summary>
        /// Should verify if the Company email is already being used by another register on the database.
        /// </summary>
        /// <param name="companyDto">The Company object that is being added or updated.</param>
        /// <returns>True when the Email is duplicated; Otherwise false.</returns>
        private async Task<bool> IsEmailDuplicated(ClientDto companyDto)
        {
            return await _repository.AnyAsync(_ =>
                _.Id != companyDto.Id
                && !string.IsNullOrEmpty(_.Email)
                && _.Email == companyDto.Email
            );
        }

        /// <summary>
        /// Should verify if the Company name is already being used by another register on the database.
        /// </summary>
        /// <param name="companyDto">The Company object that is being added or updated.</param>
        /// <returns>True when the Name is duplicated; Otherwise false.</returns>
        private async Task<bool> IsNameDuplicated(ClientDto companyDto)
        {
            return await _repository.AnyAsync(_ =>
                _.Id != companyDto.Id && _.Name == companyDto.Name
            );
        }

        /// <summary>
        /// Should verify if the Company NationalRegistry is already being used by another register on the database.
        /// </summary>
        /// <param name="companyDto">The Company object that is being added or updated.</param>
        /// <returns>True when the NationalIDCard is duplicated; Otherwise false.</returns>
        private async Task<bool> IsNationalRegistryDuplicated(ClientDto companyDto)
        {
            return await _repository.AnyAsync(_ =>
                _.Id != companyDto.Id
                && !string.IsNullOrEmpty(_.NationalRegistry)
                && _.NationalRegistry == companyDto.NationalRegistry
            );
        }

        #endregion Private methods
    }
}
