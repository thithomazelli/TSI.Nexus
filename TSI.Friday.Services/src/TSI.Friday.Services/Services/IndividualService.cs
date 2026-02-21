using AutoMapper;
using TSI.Friday.Contracts.Enums;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Contracts.Models.DTOs;
using TSI.Friday.Contracts.Utilities;

namespace TSI.Friday.Services
{
    public sealed class IndividualService : IIndividualService
    {
        #region Properties

        /// <summary>
        /// Repository object created to access the Individual registers on database using EntityFramework.
        /// </summary>
        private readonly IRepository<Individual> _repository;
        private readonly IMapper _mapper;

        #endregion Properties

        #region Public methods

        /// <summary>
        /// IndividualService constructor created to initialize the "_repository" using Dependency Injection.
        /// </summary>
        /// <param name="repository">IRepository<Individual> object used to initialize the internal variable using Dependency Injection.</param>
        public IndividualService(IRepository<Individual> repository, IMapper mapper)
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
                var individualDuplicatedMessage =
                    await CheckIfIndividualIsDuplicatedAndGetErrorMessage(clientDto);

                if (!string.IsNullOrEmpty(individualDuplicatedMessage))
                {
                    result.Status = ResponseStatus.Error;
                    result.Message = individualDuplicatedMessage;
                    return result;
                }

                var clientEntity = _mapper.Map<Individual>(clientDto);
                await _repository.AddAsync(clientEntity);

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
                var individualDuplicatedMessage =
                    await CheckIfIndividualIsDuplicatedAndGetErrorMessage(clientDto);

                if (!string.IsNullOrEmpty(individualDuplicatedMessage))
                {
                    result.Status = ResponseStatus.Error;
                    result.Message = individualDuplicatedMessage;
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
        public async Task<WebApiResponse<ClientDto>> FindBySocialSecurityCard(
            string socialSecurityCard
        )
        {
            WebApiResponse<ClientDto> result = new();

            try
            {
                var clientEntity = await _repository.FirstOrDefaultAsync(_ =>
                    _.SocialSecurityCard.Equals(socialSecurityCard)
                );
                result.Data = _mapper.Map<ClientDto>(clientEntity);
                result.Status = ResponseStatus.Success;
                result.Message =
                    result.Data != null
                        ? $"Cliente {result.Data.Name} encontrado com sucesso."
                        : $"Nenhum Cliente com o CPF {socialSecurityCard} foi encontrado";
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
        /// Should verify if the Individual is already being registered on the database.
        /// </summary>
        /// <param name="individualDto">The Individual object that is being added or updated.</param>
        /// <returns>The error message when Individual is duplicated. Otherwise an empty string.</returns>
        private async Task<string> CheckIfIndividualIsDuplicatedAndGetErrorMessage(
            ClientDto individualDto
        )
        {
            if (await IsNameDuplicated(individualDto))
            {
                return $"Já existe um Cliente cadastrado com Nome {individualDto.Name}.";
            }

            if (await IsEmailDuplicated(individualDto))
            {
                return $"Já existe um Cliente cadastrado com E-mail {individualDto.Email}.";
            }

            if (await IsSocialSecurityCardDuplicated(individualDto))
            {
                return $"Já existe um Cliente cadastrado com o CPF {individualDto.SocialSecurityCard}.";
            }

            if (await IsNationalIDCardDuplicated(individualDto))
            {
                return $"Já existe um Cliente cadastrado com o RG {individualDto.NationalIdCard}.";
            }

            return string.Empty;
        }

        /// <summary>
        /// Should verify if the Individual email is already being used by another register on the database.
        /// </summary>
        /// <param name="individualDto">The Individual object that is being added or updated.</param>
        /// <returns>True when the Email is duplicated; Otherwise false.</returns>
        private async Task<bool> IsEmailDuplicated(ClientDto individualDto)
        {
            return await _repository.AnyAsync(_ =>
                _.Id != individualDto.Id
                && !string.IsNullOrEmpty(_.Email)
                && _.Email == individualDto.Email
            );
        }

        /// <summary>
        /// Should verify if the Individual name is already being used by another register on the database.
        /// </summary>
        /// <param name="individualDto">The Individual object that is being added or updated.</param>
        /// <returns>True when the Name is duplicated; Otherwise false.</returns>
        private async Task<bool> IsNameDuplicated(ClientDto individualDto)
        {
            return await _repository.AnyAsync(_ =>
                _.Id != individualDto.Id && _.Name == individualDto.Name
            );
        }

        /// <summary>
        /// Should verify if the Individual NationalIDCard is already being used by another register on the database.
        /// </summary>
        /// <param name="individualDto">The Individual object that is being added or updated.</param>
        /// <returns>True when the NationalIDCard is duplicated; Otherwise false.</returns>
        private async Task<bool> IsNationalIDCardDuplicated(ClientDto individualDto)
        {
            return await _repository.AnyAsync(_ =>
                _.Id != individualDto.Id
                && !string.IsNullOrEmpty(_.NationalIdCard)
                && _.NationalIdCard == individualDto.NationalIdCard
            );
        }

        /// <summary>
        /// Should verify if the Individual SocialSecurityCard is already being used by another register on the database.
        /// </summary>
        /// <param name="individualDto">The Individual object that is being added or updated.</param>
        /// <returns>True when the SocialSecurityCard is duplicated; Otherwise false.</returns>
        private async Task<bool> IsSocialSecurityCardDuplicated(ClientDto individualDto)
        {
            return await _repository.AnyAsync(_ =>
                _.Id != individualDto.Id
                && !string.IsNullOrEmpty(_.SocialSecurityCard)
                && _.SocialSecurityCard == individualDto.SocialSecurityCard
            );
        }

        #endregion Private methods
    }
}
